package model

import "time"

// Device 绑定到系统的ESP32设备
type Device struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name        string    `json:"name" gorm:"type:varchar(100);not null"`
	DeviceType  string    `json:"device_type" gorm:"type:varchar(50);not null"` // wake_up/sleep/multi
	Model       string    `json:"model" gorm:"type:varchar(50)"`                 // M5CoreS3 / ESP32-DevKit
	HasRFID     bool      `json:"has_rfid" gorm:"default:false"`
	MQTTTopic   string    `json:"mqtt_topic" gorm:"type:varchar(200)"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	Location    string    `json:"location" gorm:"type:varchar(200)"` // 设备物理位置
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// RFIDBinding 孩子RFID卡绑定（一个孩子可绑定多张卡）
type RFIDBinding struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	ChildID   string    `json:"child_id" gorm:"type:varchar(36);index"`
	RFIDUID   string    `json:"rfid_uid" gorm:"type:varchar(100);not null;uniqueIndex"`
	Label     string    `json:"label" gorm:"type:varchar(100)"` // 卡片标签
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SleepCheckConfig 睡觉检测配置
type SleepCheckConfig struct {
	ID          string `json:"id" gorm:"primaryKey;type:varchar(36)"`
	DeviceID    string `json:"device_id" gorm:"type:varchar(36);not null;uniqueIndex"`
	StartTime   string `json:"start_time" gorm:"type:varchar(5);default:'22:00'"` // HH:mm
	EndTime     string `json:"end_time" gorm:"type:varchar(5);default:'22:20'"`   // HH:mm
	Reminder1Min int    `json:"reminder_1_min" gorm:"default:20"`                   // 第一次提醒（提前分钟数）
	Reminder2Min int    `json:"reminder_2_min" gorm:"default:10"`                   // 第二次提醒（提前分钟数）
	SoundThreshold int  `json:"sound_threshold" gorm:"default:500"`                 // 声音检测阈值
	IsEnabled   bool   `json:"is_enabled" gorm:"default:true"`
}

// 打卡记录的扩展字段（通过 device_log 外键关联）
type DeviceLog struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	DeviceID    string    `json:"device_id" gorm:"type:varchar(36);not null;index"`
	ChildID     string    `json:"child_id" gorm:"type:varchar(36);index"`
	RFIDUID     string    `json:"rfid_uid" gorm:"type:varchar(100)"`
	EventType   string    `json:"event_type" gorm:"type:varchar(50);not null"`
	MathProblem  string   `json:"math_problem" gorm:"type:varchar(200)"`   // 数学题
	MathAnswer   string   `json:"math_answer" gorm:"type:varchar(50)"`     // 正确答案
	MathUserAnswer string `json:"math_user_answer" gorm:"type:varchar(50)"` // 用户回答
	MathCorrect  *bool    `json:"math_correct"`                             // 是否正确
	MathStartTime *time.Time `json:"math_start_time"`                       // 出题时间
	MathEndTime   *time.Time `json:"math_end_time"`                         // 作答时间
	Status       string    `json:"status" gorm:"type:varchar(20);default:'pending'"`
	CreatedAt    time.Time `json:"created_at"`
}