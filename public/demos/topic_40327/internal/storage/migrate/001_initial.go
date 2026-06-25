package migrate

import "database/sql"

func init() {
	Register(Migration{
		Version:     1,
		Description: "初始表结构: user_info, emojis, messages",
		Up: func(tx *sql.Tx) error {
			_, err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS user_info (
					platform TEXT NOT NULL DEFAULT '',
					user_id TEXT NOT NULL,
					name TEXT NOT NULL DEFAULT '',
					previous_name TEXT NOT NULL DEFAULT '',
					PRIMARY KEY (platform, user_id)
				)
			`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`
				CREATE TABLE IF NOT EXISTS emojis (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					hash TEXT UNIQUE NOT NULL,
					file_name TEXT NOT NULL,
					full_path TEXT NOT NULL,
					description TEXT,
					query_count INTEGER DEFAULT 0,
					last_used_at DATETIME,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					is_registered BOOLEAN DEFAULT FALSE,
					is_banned BOOLEAN DEFAULT FALSE
				)
			`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_hash ON emojis(hash)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`
				CREATE TABLE IF NOT EXISTS messages (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					message_id TEXT UNIQUE NOT NULL,
					platform TEXT NOT NULL DEFAULT '',
					sender_id TEXT NOT NULL,
					sender_name TEXT NOT NULL DEFAULT '',
					group_id TEXT DEFAULT '',
					content TEXT NOT NULL DEFAULT '',
					direction TEXT NOT NULL DEFAULT 'in',
					is_at_me BOOLEAN DEFAULT FALSE,
					has_image BOOLEAN DEFAULT FALSE,
					reply_to_msg_id TEXT DEFAULT '',
					timestamp INTEGER NOT NULL,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(platform, group_id, sender_id)`)
			if err != nil {
				return err
			}

			_, err = tx.Exec(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)`)
			if err != nil {
				return err
			}

			return nil
		},
	})
}