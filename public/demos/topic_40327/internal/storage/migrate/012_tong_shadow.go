package migrate

import (
	"database/sql"
)

func init() {
	Register(Migration{
		Version:     12,
		Description: "瞳影: 自画像表",
		Up: func(tx *sql.Tx) error {
			_, err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS tong_shadow_portraits (
					id           TEXT PRIMARY KEY,
					image_data   BLOB NOT NULL,
					image_hash   TEXT NOT NULL UNIQUE,
					mime_type    TEXT NOT NULL DEFAULT 'image/png',
					description  TEXT NOT NULL DEFAULT '',
					embedding    BLOB,
					created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_tong_shadow_hash ON tong_shadow_portraits(image_hash)`)
			return err
		},
	})
}
