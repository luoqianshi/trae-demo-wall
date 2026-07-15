package testutil

import (
	"os"
	"path/filepath"

	"coin-kids/internal/model"
	"coin-kids/internal/repository"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitTestDB 初始化内存 SQLite 数据库用于测试
func InitTestDB() {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		panic(err)
	}

	err = db.AutoMigrate(
		&model.Child{},
		&model.Schedule{},
		&model.ScheduleTemplate{},
		&model.Allowance{},
		&model.AllowanceTransaction{},
		&model.RewardRule{},
		&model.RewardRecord{},
		&model.ClockInRecord{},
		&model.Device{},
		&model.RFIDBinding{},
		&model.SleepCheckConfig{},
		&model.DeviceLog{},
	)
	if err != nil {
		panic(err)
	}

	repository.DB = db

	// 初始化设置存储（使用临时文件）
	tmpDir, _ := os.MkdirTemp("", "coin-kids-test")
	repository.InitSettings(filepath.Join(tmpDir, "settings.json"))
}

// CleanTestDB 清理测试数据
func CleanTestDB() {
	db := repository.GetDB()
	if db == nil {
		return
	}
	tables := []string{
		"children", "schedules", "schedule_templates",
		"allowances", "allowance_transactions",
		"reward_rules", "reward_records",
		"clock_in_records",
		"devices", "rfid_bindings", "sleep_check_configs", "device_logs",
	}
	for _, t := range tables {
		db.Exec("DELETE FROM " + t)
	}
}