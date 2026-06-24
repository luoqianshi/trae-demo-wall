package migrate

import "database/sql"

func init() {
	Register(Migration{
		Version:     4,
		Description: "记忆系统: memory_fragments 表",
		Up: func(tx *sql.Tx) error {
			_, err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS memory_fragments (
					id TEXT PRIMARY KEY,
					session_id TEXT NOT NULL,
					platform TEXT NOT NULL DEFAULT '',
					group_id TEXT DEFAULT '',
					user_id TEXT DEFAULT '',
					content TEXT NOT NULL,
					source_kind TEXT NOT NULL DEFAULT 'chat_message',
					hash_value TEXT NOT NULL,
					keywords TEXT DEFAULT '',
					metadata TEXT DEFAULT '{}',
					access_count INTEGER DEFAULT 0,
					last_access_at DATETIME,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					expires_at DATETIME
				)
			`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_memory_session ON memory_fragments(session_id, source_kind)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_memory_hash ON memory_fragments(hash_value)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_memory_created ON memory_fragments(created_at)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_memory_expires ON memory_fragments(expires_at)`)
			if err != nil {
				return err
			}

			return nil
		},
	})
}
