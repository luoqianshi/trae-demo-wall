package migrate

import "database/sql"

func init() {
	Register(Migration{
		Version:     5,
		Description: "图谱记忆: graph_entities / graph_relations / person_profiles 表",
		Up: func(tx *sql.Tx) error {
			_, err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS graph_entities (
					id TEXT PRIMARY KEY,
					name TEXT NOT NULL,
					type TEXT NOT NULL DEFAULT 'unknown',
					metadata TEXT NOT NULL DEFAULT '{}',
					created_at TEXT NOT NULL DEFAULT (datetime('now')),
					updated_at TEXT NOT NULL DEFAULT (datetime('now'))
				)
			`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_graph_entities_name ON graph_entities(name)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_graph_entities_type ON graph_entities(type)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`
				CREATE TABLE IF NOT EXISTS graph_relations (
					id TEXT PRIMARY KEY,
					subject TEXT NOT NULL,
					predicate TEXT NOT NULL,
					object TEXT NOT NULL,
					metadata TEXT NOT NULL DEFAULT '{}',
					created_at TEXT NOT NULL DEFAULT (datetime('now'))
				)
			`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_graph_relations_subject ON graph_relations(subject)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_graph_relations_object ON graph_relations(object)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_graph_relations_predicate ON graph_relations(predicate)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`
				CREATE TABLE IF NOT EXISTS person_profiles (
					person_id TEXT PRIMARY KEY,
					primary_name TEXT NOT NULL DEFAULT '',
					aliases TEXT NOT NULL DEFAULT '[]',
					sections TEXT NOT NULL DEFAULT '{}',
					version INTEGER NOT NULL DEFAULT 1,
					created_at TEXT NOT NULL DEFAULT (datetime('now')),
					updated_at TEXT NOT NULL DEFAULT (datetime('now'))
				)
			`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_person_profiles_name ON person_profiles(primary_name)`)
			if err != nil {
				return err
			}

			return nil
		},
	})
}
