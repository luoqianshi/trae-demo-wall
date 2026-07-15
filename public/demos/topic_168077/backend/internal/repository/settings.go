package repository

import (
	"encoding/json"
	"os"
	"path/filepath"
	"coin-kids/internal/model"
	"sync"
)

var (
	settingsData model.SystemSetting
	settingsMu   sync.RWMutex
	settingsPath string
)

func InitSettings(path string) {
	settingsPath = path
	loadSettings()
}

func loadSettings() {
	settingsMu.Lock()
	defer settingsMu.Unlock()
	data, err := os.ReadFile(settingsPath)
	if err != nil {
		settingsData = model.SystemSetting{
			MQTT: model.MQTTSetting{
				Broker:      "mqtt://broker.emqx.io:1883",
				TopicPrefix: "coin-kids",
			},
			AI: model.AISetting{
				APIEndpoint: "https://api.openai.com/v1/chat/completions",
				Model:       "gpt-3.5-turbo",
			},
		}
		_ = saveSettingsLocked()
		return
	}
	_ = json.Unmarshal(data, &settingsData)
}

func GetSettings() model.SystemSetting {
	settingsMu.RLock()
	defer settingsMu.RUnlock()
	return settingsData
}

func UpdateSettings(s model.SystemSetting) error {
	settingsMu.Lock()
	defer settingsMu.Unlock()
	settingsData = s
	return saveSettingsLocked()
}

func saveSettingsLocked() error {
	dir := filepath.Dir(settingsPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	data, _ := json.MarshalIndent(settingsData, "", "  ")
	return os.WriteFile(settingsPath, data, 0644)
}