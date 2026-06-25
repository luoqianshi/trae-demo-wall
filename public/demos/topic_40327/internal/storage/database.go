package storage

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	"YaraFlow/internal/storage/migrate"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func Init(dbPath string) error {
	if dbPath == "" {
		dbPath = "./data/yaraflow.db"
	}

	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("创建数据库目录失败: %w", err)
	}

	var err error
	db, err = sql.Open("sqlite3", dbPath+"?_busy_timeout=10000&_journal_mode=WAL")
	if err != nil {
		return fmt.Errorf("连接SQLite失败: %w", err)
	}

	db.SetMaxOpenConns(1)

	if err = db.Ping(); err != nil {
		return fmt.Errorf("测试SQLite连接失败: %w", err)
	}

	_, err = db.Exec("PRAGMA journal_mode=WAL")
	if err != nil {
		return fmt.Errorf("设置WAL模式失败: %w", err)
	}

	_, err = db.Exec("PRAGMA synchronous=NORMAL")
	if err != nil {
		return fmt.Errorf("设置同步模式失败: %w", err)
	}

	if err := migrate.Migrate(db); err != nil {
		return fmt.Errorf("数据库迁移失败: %w", err)
	}

	return nil
}

func GetDB() *sql.DB {
	return db
}

func Close() {
	if db != nil {
		db.Close()
	}
}
