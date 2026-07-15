package repository

import (
	"coin-kids/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RewardRepo struct {
	db *gorm.DB
}

func NewRewardRepo() *RewardRepo {
	return &RewardRepo{db: GetDB()}
}

// --- Rules ---

func (r *RewardRepo) CreateRule(rule *model.RewardRule) error {
	if rule.ID == "" {
		rule.ID = uuid.New().String()
	}
	return r.db.Create(rule).Error
}

func (r *RewardRepo) UpdateRule(rule *model.RewardRule) error {
	return r.db.Save(rule).Error
}

func (r *RewardRepo) DeleteRule(id string) error {
	return r.db.Delete(&model.RewardRule{}, "id = ?", id).Error
}

func (r *RewardRepo) ListRules() ([]model.RewardRule, error) {
	var rules []model.RewardRule
	err := r.db.Order("type ASC, name ASC").Find(&rules).Error
	return rules, err
}

func (r *RewardRepo) GetRuleByID(id string) (*model.RewardRule, error) {
	var rule model.RewardRule
	err := r.db.First(&rule, "id = ?", id).Error
	return &rule, err
}

// --- Records ---

func (r *RewardRepo) CreateRecord(record *model.RewardRecord) error {
	if record.ID == "" {
		record.ID = uuid.New().String()
	}
	return r.db.Create(record).Error
}

func (r *RewardRepo) UpdateRecord(record *model.RewardRecord) error {
	return r.db.Save(record).Error
}

func (r *RewardRepo) DeleteRecord(id string) error {
	return r.db.Delete(&model.RewardRecord{}, "id = ?", id).Error
}

func (r *RewardRepo) GetRecordByID(id string) (*model.RewardRecord, error) {
	var record model.RewardRecord
	err := r.db.First(&record, "id = ?", id).Error
	return &record, err
}

func (r *RewardRepo) ListRecords(childID string) ([]model.RewardRecord, error) {
	var records []model.RewardRecord
	query := r.db.Order("created_at DESC")
	if childID != "" {
		query = query.Where("child_id = ?", childID)
	}
	err := query.Find(&records).Error
	return records, err
}

func (r *RewardRepo) ListRecordsByDateRange(childID, startDate, endDate string) ([]model.RewardRecord, error) {
	var records []model.RewardRecord
	err := r.db.Where("child_id = ? AND created_at BETWEEN ? AND ?", childID, startDate, endDate).
		Order("created_at DESC").Find(&records).Error
	return records, err
}