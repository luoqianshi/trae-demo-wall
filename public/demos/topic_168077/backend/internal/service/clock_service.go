package service

import (
	"coin-kids/internal/model"
	"coin-kids/internal/repository"
)

// ClockService 处理旧版 HTTP 打卡记录
type ClockService struct {
	repo *repository.ClockRepo
}

func NewClockService() *ClockService {
	return &ClockService{repo: repository.NewClockRepo()}
}

func (s *ClockService) Create(record *model.ClockInRecord) error {
	return s.repo.Create(record)
}

func (s *ClockService) Confirm(id string) error {
	record, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	record.Status = "confirmed"
	return s.repo.Update(record)
}

func (s *ClockService) Reject(id string) error {
	record, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	record.Status = "rejected"
	return s.repo.Update(record)
}

func (s *ClockService) ListByChild(childID string) ([]model.ClockInRecord, error) {
	return s.repo.ListByChild(childID)
}

func (s *ClockService) ListByDevice(deviceID string) ([]model.ClockInRecord, error) {
	return s.repo.ListByDevice(deviceID)
}