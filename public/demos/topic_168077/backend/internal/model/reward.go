package model

import "time"

type RewardRule struct {
	ID          string  `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name        string  `json:"name" gorm:"type:varchar(200);not null"`
	Type        string  `json:"type" gorm:"type:varchar(20);not null"` // reward/penalty
	Amount      float64 `json:"amount" gorm:"type:decimal(10,2);not null"`
	Description string  `json:"description" gorm:"type:varchar(500)"`
	IsActive    bool    `json:"is_active" gorm:"default:true"`
}

type RewardRecord struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	ChildID     string    `json:"child_id" gorm:"type:varchar(36);not null;index"`
	RuleID      string    `json:"rule_id" gorm:"type:varchar(36)"`
	Type        string    `json:"type" gorm:"type:varchar(20);not null"` // reward/penalty
	Amount      float64   `json:"amount" gorm:"type:decimal(10,2);not null"`
	Reason      string    `json:"reason" gorm:"type:varchar(500)"`
	CreatedBy   string    `json:"created_by" gorm:"type:varchar(50)"` // 家长/系统/ESP32
	CreatedAt   time.Time `json:"created_at"`
}