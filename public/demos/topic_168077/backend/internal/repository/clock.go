package repository

import (
	"coin-kids/internal/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ClockRepo struct {
	db *gorm.DB
}

func NewClockRepo() *ClockRepo {
	return &ClockRepo{db: GetDB()}
}

func (r *ClockRepo) Create(record *model.ClockInRecord) error {
	if record.ID == "" {
		record.ID = uuid.New().String()
	}
	return r.db.Create(record).Error
}

func (r *ClockRepo) Update(record *model.ClockInRecord) error {
	return r.db.Save(record).Error
}

func (r *ClockRepo) GetByID(id string) (*model.ClockInRecord, error) {
	var record model.ClockInRecord
	err := r.db.First(&record, "id = ?", id).Error
	return &record, err
}

func (r *ClockRepo) ListByChild(childID string) ([]model.ClockInRecord, error) {
	var records []model.ClockInRecord
	err := r.db.Where("child_id = ?", childID).
		Order("timestamp DESC").Find(&records).Error
	return records, err
}

func (r *ClockRepo) ListByDateRange(childID string, start, end time.Time) ([]model.ClockInRecord, error) {
	var records []model.ClockInRecord
	query := r.db.Where("timestamp BETWEEN ? AND ?", start, end)
	if childID != "" {
		query = query.Where("child_id = ?", childID)
	}
	err := query.Order("timestamp ASC").Find(&records).Error
	return records, err
}

func (r *ClockRepo) ListByDevice(deviceID string) ([]model.ClockInRecord, error) {
	var records []model.ClockInRecord
	err := r.db.Where("device_id = ?", deviceID).
		Order("timestamp DESC").Find(&records).Error
	return records, err
}