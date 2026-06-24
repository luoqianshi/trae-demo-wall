package migrate

import (
	"database/sql"
	"strings"

	"YaraFlow/internal/logger"
)

func init() {
	Register(Migration{
		Version:     6,
		Description: "消息全文搜索: 创建FTS5索引",
		Up: func(tx *sql.Tx) error {
			// 检查SQLite是否支持FTS5
			var hasFTS5 bool
			err := tx.QueryRow(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='sqlite_stat1'`).Scan(&hasFTS5)
			if err != nil {
				// 无法检测，尝试直接创建
			}

			// 尝试创建FTS5表，如果失败（可能是FTS5不可用），则跳过
			_, err = tx.Exec(`
				CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
					content,
					sender_name,
					group_id,
					content_rowid='id',
					content='messages'
				)
			`)
			if err != nil {
				// FTS5不可用，记录警告并跳过
				if strings.Contains(err.Error(), "no such module: fts5") {
					logger.Warn("FTS5模块不可用，跳过全文搜索索引创建")
					FTS5Available = false
					return nil
				}
				return err
			}

			FTS5Available = true

			// 创建触发器：插入时同步FTS
			_, err = tx.Exec(`
				CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
					INSERT INTO messages_fts(rowid, content, sender_name, group_id)
					VALUES (new.id, new.content, new.sender_name, new.group_id);
				END
			`)
			if err != nil {
				return err
			}

			// 创建触发器：删除时同步FTS
			_, err = tx.Exec(`
				CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
					INSERT INTO messages_fts(messages_fts, rowid, content, sender_name, group_id)
					VALUES ('delete', old.id, old.content, old.sender_name, old.group_id);
				END
			`)
			if err != nil {
				return err
			}

			// 创建触发器：更新时同步FTS
			_, err = tx.Exec(`
				CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
					INSERT INTO messages_fts(messages_fts, rowid, content, sender_name, group_id)
					VALUES ('delete', old.id, old.content, old.sender_name, old.group_id);
					INSERT INTO messages_fts(rowid, content, sender_name, group_id)
					VALUES (new.id, new.content, new.sender_name, new.group_id);
				END
			`)
			if err != nil {
				return err
			}

			// 填充已有数据到FTS索引
			_, err = tx.Exec(`
				INSERT INTO messages_fts(messages_fts)
				VALUES ('rebuild')
			`)
			return err
		},
	})
}
