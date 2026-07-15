package model

import "time"

type ClockInRecord struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	ChildID   string    `json:"child_id" gorm:"type:varchar(36);not null;index"`
	DeviceID  string    `json:"device_id" gorm:"type:varchar(100)"`
	EventType string    `json:"event_type" gorm:"type:varchar(50);not null"` // wake_up/sleep/study/meal/play
	Status    string    `json:"status" gorm:"type:varchar(20);default:'pending'"` // pending/confirmed/rejected
	Timestamp time.Time `json:"timestamp"`
	CreatedAt time.Time `json:"created_at"`
}