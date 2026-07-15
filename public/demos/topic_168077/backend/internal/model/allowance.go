package model

import "time"

type Allowance struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	ChildID   string    `json:"child_id" gorm:"type:varchar(36);not null;uniqueIndex"`
	Balance   float64   `json:"balance" gorm:"type:decimal(10,2);default:0"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AllowanceTransaction struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	ChildID     string    `json:"child_id" gorm:"type:varchar(36);not null;index"`
	Type        string    `json:"type" gorm:"type:varchar(20);not null"`        // reward/penalty/spend/adjust
	Amount      float64   `json:"amount" gorm:"type:decimal(10,2);not null"`    // 正数=收入，负数=支出
	Description string    `json:"description" gorm:"type:varchar(500)"`
	CreatedAt   time.Time `json:"created_at"`
}