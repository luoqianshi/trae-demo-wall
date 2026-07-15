package repository

import (
	"coin-kids/internal/model"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ScheduleRepo struct {
	db *gorm.DB
}

func NewScheduleRepo() *ScheduleRepo {
	return &ScheduleRepo{db: GetDB()}
}

func (r *ScheduleRepo) Create(schedule *model.Schedule) error {
	if schedule.ID == "" {
		schedule.ID = uuid.New().String()
	}
	return r.db.Create(schedule).Error
}

func (r *ScheduleRepo) Update(schedule *model.Schedule) error {
	return r.db.Save(schedule).Error
}

func (r *ScheduleRepo) Delete(id string) error {
	return r.db.Delete(&model.Schedule{}, "id = ?", id).Error
}

func (r *ScheduleRepo) GetByID(id string) (*model.Schedule, error) {
	var s model.Schedule
	err := r.db.First(&s, "id = ?", id).Error
	return &s, err
}

func (r *ScheduleRepo) ListByChildAndDate(childID, date string) ([]model.Schedule, error) {
	var schedules []model.Schedule
	err := r.db.Where("child_id = ? AND date = ?", childID, date).
		Order("start_time ASC").Find(&schedules).Error
	return schedules, err
}

func (r *ScheduleRepo) ListByDate(date string) ([]model.Schedule, error) {
	var schedules []model.Schedule
	err := r.db.Where("date = ?", date).
		Order("child_id, start_time ASC").Find(&schedules).Error
	return schedules, err
}

// GenerateDailySchedules 从模板生成某天的作息安排
func (r *ScheduleRepo) GenerateDailySchedules(childID, date string) error {
	parsed, err := time.Parse("2006-01-02", date)
	if err != nil {
		return fmt.Errorf("日期格式错误: %v", err)
	}
	dayOfWeek := int(parsed.Weekday())
	var templates []model.ScheduleTemplate
	if err := r.db.Where("day_of_week = ?", dayOfWeek).Order("sort_order ASC").Find(&templates).Error; err != nil {
		return err
	}
	for _, tpl := range templates {
		schedule := &model.Schedule{
			ID:        uuid.New().String(),
			ChildID:   childID,
			Date:      date,
			StartTime: tpl.StartTime,
			EndTime:   tpl.EndTime,
			Activity:  tpl.Activity,
			IsFixed:   true,
			Status:    "pending",
		}
		if err := r.db.Create(schedule).Error; err != nil {
			return err
		}
	}
	return nil
}

// GenerateDailySchedulesWithTemplateIDs 从指定的模板ID列表生成作息安排
func (r *ScheduleRepo) GenerateDailySchedulesWithTemplateIDs(childID, date string, templateIDs []string) error {
	var templates []model.ScheduleTemplate
	if err := r.db.Where("id IN ?", templateIDs).Order("sort_order ASC").Find(&templates).Error; err != nil {
		return err
	}
	for _, tpl := range templates {
		schedule := &model.Schedule{
			ID:        uuid.New().String(),
			ChildID:   childID,
			Date:      date,
			StartTime: tpl.StartTime,
			EndTime:   tpl.EndTime,
			Activity:  tpl.Activity,
			IsFixed:   true,
			Status:    "pending",
		}
		if err := r.db.Create(schedule).Error; err != nil {
			return err
		}
	}
	return nil
}

// --- Template methods ---

func (r *ScheduleRepo) CreateTemplate(tpl *model.ScheduleTemplate) error {
	if tpl.ID == "" {
		tpl.ID = uuid.New().String()
	}
	return r.db.Create(tpl).Error
}

func (r *ScheduleRepo) UpdateTemplate(tpl *model.ScheduleTemplate) error {
	return r.db.Save(tpl).Error
}

func (r *ScheduleRepo) DeleteTemplate(id string) error {
	return r.db.Delete(&model.ScheduleTemplate{}, "id = ?", id).Error
}

func (r *ScheduleRepo) ListTemplates() ([]model.ScheduleTemplate, error) {
	var templates []model.ScheduleTemplate
	err := r.db.Order("day_of_week, sort_order ASC").Find(&templates).Error
	return templates, err
}