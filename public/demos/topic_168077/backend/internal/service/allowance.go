package service

import (
	"coin-kids/internal/model"
	"coin-kids/internal/repository"

	"github.com/google/uuid"
)

type AllowanceService struct {
	repo *repository.AllowanceRepo
}

func NewAllowanceService() *AllowanceService {
	return &AllowanceService{repo: repository.NewAllowanceRepo()}
}

func (s *AllowanceService) GetBalance(childID string) (*model.Allowance, error) {
	return s.repo.GetOrCreate(childID)
}

// AddReward 奖励（增加零花钱）
func (s *AllowanceService) AddReward(childID string, amount float64, description string) error {
	allowance, err := s.repo.GetOrCreate(childID)
	if err != nil {
		return err
	}
	allowance.Balance += amount

	tx := &model.AllowanceTransaction{
		ID:          uuid.New().String(),
		ChildID:     childID,
		Type:        "reward",
		Amount:      amount,
		Description: description,
	}

	if err := s.repo.UpdateBalance(allowance); err != nil {
		return err
	}
	return s.repo.AddTransaction(tx)
}

// AddPenalty 惩罚（扣减零花钱）
func (s *AllowanceService) AddPenalty(childID string, amount float64, description string) error {
	allowance, err := s.repo.GetOrCreate(childID)
	if err != nil {
		return err
	}
	allowance.Balance -= amount

	tx := &model.AllowanceTransaction{
		ID:          uuid.New().String(),
		ChildID:     childID,
		Type:        "penalty",
		Amount:      -amount,
		Description: description,
	}

	if err := s.repo.UpdateBalance(allowance); err != nil {
		return err
	}
	return s.repo.AddTransaction(tx)
}

// Spend 消费
func (s *AllowanceService) Spend(childID string, amount float64, description string) error {
	allowance, err := s.repo.GetOrCreate(childID)
	if err != nil {
		return err
	}
	if allowance.Balance < amount {
		return ErrInsufficientBalance
	}
	allowance.Balance -= amount

	tx := &model.AllowanceTransaction{
		ID:          uuid.New().String(),
		ChildID:     childID,
		Type:        "spend",
		Amount:      -amount,
		Description: description,
	}

	if err := s.repo.UpdateBalance(allowance); err != nil {
		return err
	}
	return s.repo.AddTransaction(tx)
}

func (s *AllowanceService) ListTransactions(childID string) ([]model.AllowanceTransaction, error) {
	return s.repo.ListTransactions(childID)
}

var ErrInsufficientBalance = &AppError{Message: "余额不足"}

type AppError struct {
	Message string
}

func (e *AppError) Error() string {
	return e.Message
}