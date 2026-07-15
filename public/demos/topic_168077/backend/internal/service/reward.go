package service

import (
	"coin-kids/internal/model"
	"coin-kids/internal/repository"
)

type RewardService struct {
	repo           *repository.RewardRepo
	allowanceSvc   *AllowanceService
}

func NewRewardService() *RewardService {
	return &RewardService{
		repo:         repository.NewRewardRepo(),
		allowanceSvc: NewAllowanceService(),
	}
}

// --- Rules ---

func (s *RewardService) CreateRule(rule *model.RewardRule) error {
	return s.repo.CreateRule(rule)
}

func (s *RewardService) UpdateRule(rule *model.RewardRule) error {
	return s.repo.UpdateRule(rule)
}

func (s *RewardService) DeleteRule(id string) error {
	return s.repo.DeleteRule(id)
}

func (s *RewardService) ListRules() ([]model.RewardRule, error) {
	return s.repo.ListRules()
}

// --- Records ---

func (s *RewardService) CreateRecord(record *model.RewardRecord) error {
	// Create the reward record
	if err := s.repo.CreateRecord(record); err != nil {
		return err
	}
	// Update allowance balance
	if record.Type == "reward" {
		return s.allowanceSvc.AddReward(record.ChildID, record.Amount, record.Reason)
	} else {
		return s.allowanceSvc.AddPenalty(record.ChildID, record.Amount, record.Reason)
	}
}

func (s *RewardService) ListRecords(childID string) ([]model.RewardRecord, error) {
	return s.repo.ListRecords(childID)
}

func (s *RewardService) UpdateRecord(record *model.RewardRecord) error {
	// 获取旧记录以计算差价
	old, err := s.repo.GetRecordByID(record.ID)
	if err != nil {
		return err
	}
	// 先逆转旧记录的零花钱影响
	if old.Type == "reward" {
		s.allowanceSvc.AddPenalty(old.ChildID, old.Amount, "撤销奖励: "+old.Reason)
	} else {
		s.allowanceSvc.AddReward(old.ChildID, old.Amount, "撤销惩罚: "+old.Reason)
	}
	// 保存更新后的记录
	if err := s.repo.UpdateRecord(record); err != nil {
		return err
	}
	// 重新应用新记录的零花钱影响
	if record.Type == "reward" {
		return s.allowanceSvc.AddReward(record.ChildID, record.Amount, record.Reason)
	} else {
		return s.allowanceSvc.AddPenalty(record.ChildID, record.Amount, record.Reason)
	}
}

func (s *RewardService) DeleteRecord(id string) error {
	// 获取记录以逆转零花钱影响
	record, err := s.repo.GetRecordByID(id)
	if err != nil {
		return err
	}
	// 逆转零花钱影响
	if record.Type == "reward" {
		s.allowanceSvc.AddPenalty(record.ChildID, record.Amount, "删除奖励: "+record.Reason)
	} else {
		s.allowanceSvc.AddReward(record.ChildID, record.Amount, "删除惩罚: "+record.Reason)
	}
	return s.repo.DeleteRecord(id)
}

func (s *RewardService) ListRecordsByDateRange(childID, startDate, endDate string) ([]model.RewardRecord, error) {
	return s.repo.ListRecordsByDateRange(childID, startDate, endDate)
}