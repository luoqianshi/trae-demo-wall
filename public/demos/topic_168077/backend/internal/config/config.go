package config

import (
	"fmt"
	"os"
	"path/filepath"
)

type Config struct {
	AppMode    string // development or production
	DBType     string // sqlite or postgres
	DBPath     string // for SQLite
	DBHost     string // for PostgreSQL
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	ServerPort string
	StaticDir  string // 前端静态文件目录（生产模式）
	MQTTBroker   string // MQTT Broker地址
	MQTTClientID string // MQTT客户端ID
	WakeUpStart  string // 起床打卡开始时间
	WakeUpEnd    string // 起床打卡结束时间
}

func Load() *Config {
	cfg := &Config{
		AppMode:    getEnv("APP_MODE", "development"),
		DBType:     getEnv("DB_TYPE", "sqlite"),
		DBPath:     getEnv("DB_PATH", "./data/coin-kids.db"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "coin-kids"),
		ServerPort: getEnv("SERVER_PORT", "8080"),
		StaticDir:  getEnv("STATIC_DIR", ""),
		MQTTBroker:   getEnv("MQTT_BROKER", "tcp://broker.emqx.io:1883"),
		MQTTClientID: getEnv("MQTT_CLIENT_ID", "coin-kids-server"),
		WakeUpStart:  getEnv("WAKEUP_START", "06:00"),
		WakeUpEnd:    getEnv("WAKEUP_END", "08:00"),
	}

	// 自动检测前端静态目录
	if cfg.AppMode == "production" && cfg.StaticDir == "" {
		if _, err := os.Stat("../frontend/dist"); err == nil {
			absPath, _ := filepath.Abs("../frontend/dist")
			cfg.StaticDir = absPath
		}
	}

	return cfg
}

func (c *Config) DSN() string {
	if c.DBType == "postgres" {
		return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
			c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName)
	}
	return c.DBPath
}

func (c *Config) IsProduction() bool {
	return c.AppMode == "production"
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}