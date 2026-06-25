package migrate

import (
	"database/sql"
	"fmt"
)

func init() {
	Register(Migration{
		Version:     11,
		Description: "决策上下文: 适配新action体系，添加think_level列",
		Up: func(tx *sql.Tx) error {
			// 1. 添加 think_level 列（SQLite ALTER TABLE 只支持 ADD COLUMN）
			_, err := tx.Exec(`ALTER TABLE decision_context ADD COLUMN think_level INTEGER DEFAULT 0`)
			if err != nil {
				// 列已存在的情况忽略错误（幂等迁移）
				// SQLite 没有 "IF NOT EXISTS" 语法，但重复添加会报错
				// 简单判断：如果表已有该列，跳过
				// 通过 PRAGMA 检查列是否存在
				rows, pragmaErr := tx.Query(`PRAGMA table_info(decision_context)`)
				if pragmaErr != nil {
					return fmt.Errorf("检查表结构失败: %w", pragmaErr)
				}
				defer rows.Close()
				hasThinkLevel := false
				for rows.Next() {
					var cid int
					var name, colType string
					var notNull int
					var defaultVal sql.NullString
					var pk int
					if scanErr := rows.Scan(&cid, &name, &colType, &notNull, &defaultVal, &pk); scanErr != nil {
						continue
					}
					if name == "think_level" {
						hasThinkLevel = true
						break
					}
				}
				if !hasThinkLevel {
					return fmt.Errorf("添加 think_level 列失败: %w", err)
				}
			}
			return nil
		},
	})
}
