package migrate

import "database/sql"

func init() {
	Register(Migration{
		Version:     14,
		Description: "记忆片段: 新增 emotional_tone 情感标签字段",
		Up: func(tx *sql.Tx) error {
			_, err := tx.Exec(`ALTER TABLE memory_fragments ADD COLUMN emotional_tone TEXT DEFAULT ''`)
			return err
		},
	})
}