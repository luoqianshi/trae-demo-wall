package repository

import (
	"coin-kids/internal/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DeviceRepo struct {
	db *gorm.DB
}

func NewDeviceRepo() *DeviceRepo {
	return &DeviceRepo{db: GetDB()}
}

func (r *DeviceRepo) Create(d *model.Device) error {
	if d.ID == "" {
		d.ID = uuid.New().String()
	}
	return r.db.Create(d).Error
}

func (r *DeviceRepo) Update(d *model.Device) error {
	return r.db.Save(d).Error
}

func (r *DeviceRepo) Delete(id string) error {
	return r.db.Delete(&model.Device{}, "id = ?", id).Error
}

func (r *DeviceRepo) GetByID(id string) (*model.Device, error) {
	var d model.Device
	err := r.db.First(&d, "id = ?", id).Error
	return &d, err
}

func (r *DeviceRepo) List() ([]model.Device, error) {
	var devices []model.Device
	err := r.db.Order("created_at ASC").Find(&devices).Error
	return devices, err
}

func (r *DeviceRepo) ListByType(deviceType string) ([]model.Device, error) {
	var devices []model.Device
	err := r.db.Where("device_type = ?", deviceType).Find(&devices).Error
	return devices, err
}

func (r *DeviceRepo) ListByTypes(deviceTypes []string) ([]model.Device, error) {
	var devices []model.Device
	err := r.db.Where("device_type IN ?", deviceTypes).Find(&devices).Error
	return devices, err
}

// --- RFID Binding ---

type RFIDBindingRepo struct {
	db *gorm.DB
}

func NewRFIDBindingRepo() *RFIDBindingRepo {
	return &RFIDBindingRepo{db: GetDB()}
}

func (r *RFIDBindingRepo) Create(b *model.RFIDBinding) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	return r.db.Create(b).Error
}

func (r *RFIDBindingRepo) GetByID(id string) (*model.RFIDBinding, error) {
	var b model.RFIDBinding
	err := r.db.First(&b, "id = ?", id).Error
	return &b, err
}

func (r *RFIDBindingRepo) Update(b *model.RFIDBinding) error {
	return r.db.Save(b).Error
}

func (r *RFIDBindingRepo) Delete(id string) error {
	return r.db.Delete(&model.RFIDBinding{}, "id = ?", id).Error
}

func (r *RFIDBindingRepo) GetByUID(uid string) (*model.RFIDBinding, error) {
	var b model.RFIDBinding
	err := r.db.First(&b, "rfid_uid = ?", uid).Error
	return &b, err
}

func (r *RFIDBindingRepo) ListByChild(childID string) ([]model.RFIDBinding, error) {
	var bindings []model.RFIDBinding
	err := r.db.Where("child_id = ?", childID).Find(&bindings).Error
	return bindings, err
}

func (r *RFIDBindingRepo) List() ([]model.RFIDBinding, error) {
	var bindings []model.RFIDBinding
	err := r.db.Order("created_at ASC").Find(&bindings).Error
	return bindings, err
}

// --- SleepCheck ---

type SleepCheckRepo struct {
	db *gorm.DB
}

func NewSleepCheckRepo() *SleepCheckRepo {
	return &SleepCheckRepo{db: GetDB()}
}

func (r *SleepCheckRepo) GetOrCreate(deviceID string) (*model.SleepCheckConfig, error) {
	var cfg model.SleepCheckConfig
	err := r.db.Where("device_id = ?", deviceID).First(&cfg).Error
	if err == gorm.ErrRecordNotFound {
		cfg = model.SleepCheckConfig{
			ID:         uuid.New().String(),
			DeviceID:   deviceID,
			StartTime:  "22:00",
			EndTime:    "22:20",
			Reminder1Min: 20,
			Reminder2Min: 10,
			SoundThreshold: 500,
			IsEnabled:  true,
		}
		err = r.db.Create(&cfg).Error
	}
	return &cfg, err
}

func (r *SleepCheckRepo) Update(cfg *model.SleepCheckConfig) error {
	return r.db.Save(cfg).Error
}

// --- DeviceLog ---

type DeviceLogRepo struct {
	db *gorm.DB
}

func NewDeviceLogRepo() *DeviceLogRepo {
	return &DeviceLogRepo{db: GetDB()}
}

func (r *DeviceLogRepo) Create(log *model.DeviceLog) error {
	if log.ID == "" {
		log.ID = uuid.New().String()
	}
	return r.db.Create(log).Error
}

func (r *DeviceLogRepo) Update(log *model.DeviceLog) error {
	return r.db.Save(log).Error
}

func (r *DeviceLogRepo) GetByID(id string) (*model.DeviceLog, error) {
	var log model.DeviceLog
	err := r.db.First(&log, "id = ?", id).Error
	return &log, err
}

func (r *DeviceLogRepo) ListByChild(childID string) ([]model.DeviceLog, error) {
	var logs []model.DeviceLog
	query := r.db.Order("created_at DESC")
	if childID != "" {
		query = query.Where("child_id = ?", childID)
	}
	err := query.Find(&logs).Error
	return logs, err
}

func (r *DeviceLogRepo) ListDeviceLogs(childID, deviceID, sort string) ([]model.DeviceLog, error) {
	var logs []model.DeviceLog
	query := r.db
	if childID != "" {
		query = query.Where("child_id = ?", childID)
	}
	if deviceID != "" {
		query = query.Where("device_id = ?", deviceID)
	}
	if sort != "asc" {
		sort = "desc"
	}
	err := query.Order("created_at " + sort).Find(&logs).Error
	return logs, err
}

func (r *DeviceLogRepo) ListByDevice(deviceID string) ([]model.DeviceLog, error) {
	var logs []model.DeviceLog
	err := r.db.Where("device_id = ?", deviceID).
		Order("created_at DESC").Find(&logs).Error
	return logs, err
}

func (r *DeviceLogRepo) ListByDateRange(childID string, start, end time.Time) ([]model.DeviceLog, error) {
	var logs []model.DeviceLog
	query := r.db.Where("created_at BETWEEN ? AND ?", start, end)
	if childID != "" {
		query = query.Where("child_id = ?", childID)
	}
	err := query.Order("created_at ASC").Find(&logs).Error
	return logs, err
}

// 检查是否有正在等待答题的设备日志（用于多设备调度）
func (r *DeviceLogRepo) FindPendingMath(deviceID string) (*model.DeviceLog, error) {
	var log model.DeviceLog
	err := r.db.Where("device_id = ? AND status = ? AND math_user_answer = ''",
		deviceID, "pending").Order("created_at DESC").First(&log).Error
	return &log, err
}