package repository

import (
	"coin-kids/internal/config"
	"coin-kids/internal/model"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB(cfg *config.Config) error {
	var dialector gorm.Dialector
	if cfg.DBType == "postgres" {
		dialector = postgres.Open(cfg.DSN())
	} else {
		dialector = sqlite.Open(cfg.DSN())
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	// Auto migrate tables
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
		return err
	}

	DB = db
	return nil
}

func GetDB() *gorm.DB {
	return DB
}