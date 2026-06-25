package storage

import (
	"database/sql"
	"fmt"

	"YaraFlow/internal/logger"
)

func SetPluginData(pluginID, key, value string) error {
	if db == nil {
		return fmt.Errorf("database not initialized")
	}

	_, err := db.Exec(`INSERT OR REPLACE INTO plugin_data (plugin_id, key, value) VALUES (?, ?, ?)`,
		pluginID, key, value)
	if err != nil {
		return fmt.Errorf("failed to set plugin data: %w", err)
	}

	logger.Sugar.Infow("PluginData set", "plugin", pluginID, "key", key)
	return nil
}

func GetPluginData(pluginID, key string) (string, error) {
	if db == nil {
		return "", fmt.Errorf("database not initialized")
	}

	var value string
	err := db.QueryRow("SELECT value FROM plugin_data WHERE plugin_id = ? AND key = ?", pluginID, key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("failed to get plugin data: %w", err)
	}

	return value, nil
}

func DeletePluginData(pluginID, key string) error {
	if db == nil {
		return fmt.Errorf("database not initialized")
	}

	_, err := db.Exec("DELETE FROM plugin_data WHERE plugin_id = ? AND key = ?", pluginID, key)
	if err != nil {
		return fmt.Errorf("failed to delete plugin data: %w", err)
	}

	return nil
}
