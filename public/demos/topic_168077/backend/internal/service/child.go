package service

import (
	"coin-kids/internal/model"
	"coin-kids/internal/repository"
)

type ChildService struct {
	repo         *repository.ChildRepo
	allowanceRepo *repository.AllowanceRepo
}

func NewChildService() *ChildService {
	return &ChildService{
		repo:          repository.NewChildRepo(),
		allowanceRepo: repository.NewAllowanceRepo(),
	}
}

func (s *ChildService) Create(req *model.Child) error {
	return s.repo.Create(req)
}

func (s *ChildService) Update(child *model.Child) error {
	return s.repo.Update(child)
}

func (s *ChildService) Delete(id string) error {
	return s.repo.Delete(id)
}

func (s *ChildService) GetByID(id string) (*model.Child, error) {
	return s.repo.GetByID(id)
}

func (s *ChildService) List() ([]model.Child, error) {
	return s.repo.List()
}