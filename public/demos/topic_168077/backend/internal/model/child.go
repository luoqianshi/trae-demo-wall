package model

import "time"

type Child struct {
	ID        string     `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name      string     `json:"name" gorm:"type:varchar(100);not null"`
	Age       int        `json:"age"`
	Birthday  *string    `json:"birthday" gorm:"type:varchar(10)"` // YYYY-MM-DD
	Gender    string     `json:"gender" gorm:"type:varchar(10);default:'unknown'"` // male/female/unknown
	School    string     `json:"school" gorm:"type:varchar(200)"`
	Class     string     `json:"class" gorm:"type:varchar(100)"`
	Avatar    string     `json:"avatar" gorm:"type:varchar(255)"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}