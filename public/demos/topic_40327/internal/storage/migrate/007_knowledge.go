package migrate

import (
	"database/sql"
)

func init() {
	Register(Migration{
		Version:     7,
		Description: "备忘录: 条目表",
		Up: func(tx *sql.Tx) error {
			_, err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS knowledge_entries (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					content TEXT NOT NULL,
					tags TEXT DEFAULT '',
					source TEXT DEFAULT 'manual',
					embedding BLOB,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_entries(tags)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge_entries(source)`)
			return err
		},
	})
}