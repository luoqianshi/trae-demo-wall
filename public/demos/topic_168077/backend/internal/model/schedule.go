package model

import "time"

type Schedule struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	ChildID   string    `json:"child_id" gorm:"type:varchar(36);not null;index"`
	Date      string    `json:"date" gorm:"type:varchar(10);not null"`       // YYYY-MM-DD
	StartTime string    `json:"start_time" gorm:"type:varchar(5);not null"` // HH:mm
	EndTime   string    `json:"end_time" gorm:"type:varchar(5);not null"`   // HH:mm
	Activity  string    `json:"activity" gorm:"type:varchar(200);not null"`
	IsFixed   bool      `json:"is_fixed" gorm:"default:false"`                     // true=家长固定, false=孩子填报
	Status    string    `json:"status" gorm:"type:varchar(20);default:'pending'"` // pending/done/missed/reviewing
	ReviewNote string   `json:"review_note" gorm:"type:varchar(500)"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ScheduleTemplate 作息模板（固定时间表）
type ScheduleTemplate struct {
	ID         string `json:"id" gorm:"primaryKey;type:varchar(36)"`
	DayOfWeek  int    `json:"day_of_week" gorm:"not null"`        // 0=Sunday, 1=Monday...
	StartTime  string `json:"start_time" gorm:"type:varchar(5);not null"`
	EndTime    string `json:"end_time" gorm:"type:varchar(5);not null"`
	Activity   string `json:"activity" gorm:"type:varchar(200);not null"`
	IsRequired bool   `json:"is_required" gorm:"default:true"` // 是否必须完成
	SortOrder  int    `json:"sort_order" gorm:"default:0"`
}