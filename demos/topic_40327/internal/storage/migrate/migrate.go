package migrate

import (
	"database/sql"
	"fmt"
	"sort"
)

// Migration 单个数据库迁移
// Up 函数接收 *sql.Tx，在事务中执行，失败可回滚
type Migration struct {
	Version     int
	Description string
	Up          func(tx *sql.Tx) error
}

var migrations []Migration

// FTS5Available 标记当前数据库是否支持 FTS5 全文搜索
// 在 006_fts5 迁移中设置
var FTS5Available bool

func Register(m Migration) {
	migrations = append(migrations, m)
}

// Migrate 执行所有未应用的数据库迁移
// 每个 migration 在独立的事务中执行，失败自动回滚，不会留下半完成状态
func Migrate(db *sql.DB) error {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS version (version INTEGER NOT NULL)`)
	if err != nil {
		return fmt.Errorf("创建版本表失败: %w", err)
	}

	var currentVersion int
	err = db.QueryRow("SELECT COALESCE(MAX(version), 0) FROM version").Scan(&currentVersion)
	if err != nil {
		return fmt.Errorf("读取迁移版本失败: %w", err)
	}

	if currentVersion == 0 {
		var count int
		err = db.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='user_info'").Scan(&count)
		if err == nil && count > 0 {
			currentVersion = 1
			db.Exec("INSERT INTO version (version) VALUES (1)")
		}
	}

	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})

	for _, m := range migrations {
		if m.Version > currentVersion {
			// 每个 migration 在独立事务中执行，失败可回滚
			tx, err := db.Begin()
			if err != nil {
				return fmt.Errorf("迁移 v%d 开启事务失败: %w", m.Version, err)
			}

			if err := m.Up(tx); err != nil {
				tx.Rollback()
				return fmt.Errorf("迁移 v%d (%s) 失败: %w", m.Version, m.Description, err)
			}

			// 在同一事务中更新版本号（DELETE + INSERT 原子操作）
			if _, err := tx.Exec("DELETE FROM version"); err != nil {
				tx.Rollback()
				return fmt.Errorf("迁移 v%d 清理版本记录失败: %w", m.Version, err)
			}
			if _, err := tx.Exec("INSERT INTO version (version) VALUES (?)", m.Version); err != nil {
				tx.Rollback()
				return fmt.Errorf("迁移 v%d 写入版本记录失败: %w", m.Version, err)
			}

			if err := tx.Commit(); err != nil {
				return fmt.Errorf("迁移 v%d 提交事务失败: %w", m.Version, err)
			}

			currentVersion = m.Version
		}
	}

	return nil
}
