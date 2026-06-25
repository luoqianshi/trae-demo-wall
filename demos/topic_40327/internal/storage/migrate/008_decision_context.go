package migrate

import (
	"database/sql"
)

func init() {
	Register(Migration{
		Version:     8,
		Description: "决策上下文: 重启后恢复工具上下文",
		Up: func(tx *sql.Tx) error {
			_, err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS decision_context (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					session_id TEXT NOT NULL UNIQUE,
					decision_action TEXT DEFAULT '',
					tool_name TEXT DEFAULT '',
					tool_args TEXT DEFAULT '',
					tool_context TEXT DEFAULT '',
					memory_summary TEXT DEFAULT '',
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_decision_context_session ON decision_context(session_id)`)
			return err
		},
	})
}
