package service

import (
	"coin-kids/internal/model"
	"coin-kids/internal/repository"
)

type ScheduleService struct {
	repo *repository.ScheduleRepo
}

func NewScheduleService() *ScheduleService {
	return &ScheduleService{repo: repository.NewScheduleRepo()}
}

func (s *ScheduleService) Create(schedule *model.Schedule) error {
	return s.repo.Create(schedule)
}

func (s *ScheduleService) Update(schedule *model.Schedule) error {
	return s.repo.Update(schedule)
}

func (s *ScheduleService) Delete(id string) error {
	return s.repo.Delete(id)
}

func (s *ScheduleService) GetByID(id string) (*model.Schedule, error) {
	return s.repo.GetByID(id)
}

func (s *ScheduleService) ListByChildAndDate(childID, date string) ([]model.Schedule, error) {
	return s.repo.ListByChildAndDate(childID, date)
}

func (s *ScheduleService) ListByDate(date string) ([]model.Schedule, error) {
	return s.repo.ListByDate(date)
}

func (s *ScheduleService) GenerateDailySchedules(childID, date string) error {
	return s.repo.GenerateDailySchedules(childID, date)
}

func (s *ScheduleService) GenerateDailySchedulesWithTemplateIDs(childID, date string, templateIDs []string) error {
	return s.repo.GenerateDailySchedulesWithTemplateIDs(childID, date, templateIDs)
}

// Template methods
func (s *ScheduleService) CreateTemplate(tpl *model.ScheduleTemplate) error {
	return s.repo.CreateTemplate(tpl)
}

func (s *ScheduleService) UpdateTemplate(tpl *model.ScheduleTemplate) error {
	return s.repo.UpdateTemplate(tpl)
}

func (s *ScheduleService) DeleteTemplate(id string) error {
	return s.repo.DeleteTemplate(id)
}

func (s *ScheduleService) ListTemplates() ([]model.ScheduleTemplate, error) {
	return s.repo.ListTemplates()
}