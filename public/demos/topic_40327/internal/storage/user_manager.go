package storage

import (
	"database/sql"
	"fmt"
)

type UserInfo struct {
	Platform     string
	UserID       string
	Name         string
	PreviousName string
}

func GetUserInfo(platform, userID string) (*UserInfo, error) {
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	row := db.QueryRow("SELECT platform, user_id, name, previous_name FROM user_info WHERE platform = ? AND user_id = ?", platform, userID)

	var info UserInfo
	err := row.Scan(&info.Platform, &info.UserID, &info.Name, &info.PreviousName)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &info, nil
}

func CheckAndUpdateUserName(platform, userID, newName string) (changed bool, prevName string, err error) {
	if db == nil {
		return false, "", fmt.Errorf("数据库未初始化")
	}
	if platform == "" {
		platform = "qq"
	}
	if userID == "" || newName == "" {
		return false, "", nil
	}

	info, err := GetUserInfo(platform, userID)
	if err != nil {
		return false, "", err
	}

	if info == nil {
		_, err = db.Exec("INSERT INTO user_info (platform, user_id, name, previous_name) VALUES (?, ?, ?, '')",
			platform, userID, newName)
		if err != nil {
			return false, "", err
		}
		return false, "", nil
	}

	if info.Name == newName {
		return false, "", nil
	}

	_, err = db.Exec("UPDATE user_info SET previous_name = ?, name = ? WHERE platform = ? AND user_id = ?",
		info.Name, newName, platform, userID)
	if err != nil {
		return false, "", err
	}

	return true, info.Name, nil
}