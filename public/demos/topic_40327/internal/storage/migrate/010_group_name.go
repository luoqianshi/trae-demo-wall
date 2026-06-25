package migrate

import (
	"database/sql"
)

func init() {
	Register(Migration{
		Version:     10,
		Description: "消息表增加群名称字段: messages 增加 group_name 列",
		Up: func(tx *sql.Tx) error {
			_, err := tx.Exec(`ALTER TABLE messages ADD COLUMN group_name TEXT NOT NULL DEFAULT ''`)
			return err
		},
	})
}
