package migrate

import (
	"database/sql"
)

func init() {
	Register(Migration{
		Version:     9,
		Description: "黑话/新词词典: 自动提取群内新词并记录释义",
		Up: func(tx *sql.Tx) error {
			_, err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS jargon_dict (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					word TEXT NOT NULL UNIQUE,
					meaning TEXT NOT NULL DEFAULT '',
					frequency INTEGER NOT NULL DEFAULT 1,
					source TEXT NOT NULL DEFAULT '',
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_jargon_word ON jargon_dict(word)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_jargon_freq ON jargon_dict(frequency DESC)`)
			return err
		},
	})
}