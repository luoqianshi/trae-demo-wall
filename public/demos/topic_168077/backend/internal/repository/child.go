package repository

import (
	"coin-kids/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChildRepo struct {
	db *gorm.DB
}

func NewChildRepo() *ChildRepo {
	return &ChildRepo{db: GetDB()}
}

func (r *ChildRepo) Create(child *model.Child) error {
	if child.ID == "" {
		child.ID = uuid.New().String()
	}
	return r.db.Create(child).Error
}

func (r *ChildRepo) Update(child *model.Child) error {
	return r.db.Save(child).Error
}

func (r *ChildRepo) Delete(id string) error {
	return r.db.Delete(&model.Child{}, "id = ?", id).Error
}

func (r *ChildRepo) GetByID(id string) (*model.Child, error) {
	var child model.Child
	err := r.db.First(&child, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &child, nil
}

func (r *ChildRepo) List() ([]model.Child, error) {
	var children []model.Child
	err := r.db.Order("created_at ASC").Find(&children).Error
	return children, err
}