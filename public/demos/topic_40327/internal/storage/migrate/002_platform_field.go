package migrate

import "database/sql"

func init() {
	Register(Migration{
		Version:     2,
		Description: "添加 user_info.platform 字段，迁移旧主键结构",
		Up: func(tx *sql.Tx) error {
			hasPlatform := false
			hasOldPK := false

			rows, err := tx.Query("PRAGMA table_info(user_info)")
			if err != nil {
				return err
			}
			defer rows.Close()

			colCount := 0
			for rows.Next() {
				colCount++
				var cid int
				var name, ctype string
				var notNull, pk int
				var dflt sql.NullString
				if err := rows.Scan(&cid, &name, &ctype, &notNull, &dflt, &pk); err != nil {
					continue
				}
				if name == "platform" {
					hasPlatform = true
				}
				if pk > 0 && name == "user_id" && colCount <= 4 {
					hasOldPK = true
				}
			}

			if !hasPlatform {
				tx.Exec("ALTER TABLE user_info ADD COLUMN platform TEXT NOT NULL DEFAULT ''")
			}

			if hasOldPK {
				_, err = tx.Exec(`
					CREATE TABLE IF NOT EXISTS user_info_migrated (
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

				_, err = tx.Exec("INSERT OR IGNORE INTO user_info_migrated (platform, user_id, name, previous_name) SELECT '', user_id, name, previous_name FROM user_info")
				if err != nil {
					return err
				}

				_, err = tx.Exec("DROP TABLE user_info")
				if err != nil {
					return err
				}

				_, err = tx.Exec("ALTER TABLE user_info_migrated RENAME TO user_info")
				if err != nil {
					return err
				}
			}

			tx.Exec("UPDATE user_info SET platform = 'qq' WHERE platform = ''")

			return nil
		},
	})
}