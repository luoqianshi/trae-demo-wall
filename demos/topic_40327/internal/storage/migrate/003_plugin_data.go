package migrate

import "database/sql"

func init() {
	Register(Migration{
		Version:     3,
		Description: "添加插件数据存储表",
		Up: func(tx *sql.Tx) error {
			_, err := tx.Exec(`CREATE TABLE IF NOT EXISTS plugin_data (
				plugin_id TEXT NOT NULL,
				key TEXT NOT NULL,
				value TEXT NOT NULL DEFAULT '',
				PRIMARY KEY (plugin_id, key)
			)`)
			return err
		},
	})
}