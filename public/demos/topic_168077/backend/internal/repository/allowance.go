package repository

import (
	"coin-kids/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AllowanceRepo struct {
	db *gorm.DB
}

func NewAllowanceRepo() *AllowanceRepo {
	return &AllowanceRepo{db: GetDB()}
}

// GetOrCreate 获取或创建孩子的零花钱账户
func (r *AllowanceRepo) GetOrCreate(childID string) (*model.Allowance, error) {
	var allowance model.Allowance
	err := r.db.Where("child_id = ?", childID).First(&allowance).Error
	if err == gorm.ErrRecordNotFound {
		allowance = model.Allowance{
			ID:      uuid.New().String(),
			ChildID: childID,
			Balance: 0,
		}
		err = r.db.Create(&allowance).Error
	}
	if err != nil {
		return nil, err
	}
	return &allowance, nil
}

func (r *AllowanceRepo) UpdateBalance(allowance *model.Allowance) error {
	return r.db.Save(allowance).Error
}

// AddTransaction 添加交易记录
func (r *AllowanceRepo) AddTransaction(tx *model.AllowanceTransaction) error {
	if tx.ID == "" {
		tx.ID = uuid.New().String()
	}
	return r.db.Create(tx).Error
}

func (r *AllowanceRepo) ListTransactions(childID string) ([]model.AllowanceTransaction, error) {
	var txs []model.AllowanceTransaction
	err := r.db.Where("child_id = ?", childID).
		Order("created_at DESC").Find(&txs).Error
	return txs, err
}