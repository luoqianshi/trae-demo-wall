package handler

import (
	"net/http"
	"strings"

	"coin-kids/internal/model"
	"coin-kids/internal/service"

	"github.com/gin-gonic/gin"
)

type ScheduleHandler struct {
	svc *service.ScheduleService
}

func NewScheduleHandler() *ScheduleHandler {
	return &ScheduleHandler{svc: service.NewScheduleService()}
}

func (h *ScheduleHandler) Create(c *gin.Context) {
	var schedule model.Schedule
	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Create(&schedule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, schedule)
}

func (h *ScheduleHandler) Update(c *gin.Context) {
	id := c.Param("id")
	schedule, err := h.svc.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "作息记录不存在"})
		return
	}
	if err := c.ShouldBindJSON(schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Update(schedule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, schedule)
}

func (h *ScheduleHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

func (h *ScheduleHandler) ListByChildAndDate(c *gin.Context) {
	childID := c.Query("child_id")
	date := c.Query("date")
	schedules, err := h.svc.ListByChildAndDate(childID, date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, schedules)
}

func (h *ScheduleHandler) ListByDate(c *gin.Context) {
	date := c.Query("date")
	schedules, err := h.svc.ListByDate(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, schedules)
}

func (h *ScheduleHandler) Generate(c *gin.Context) {
	childID := c.Query("child_id")
	date := c.Query("date")
	templateIDStr := c.Query("template_ids")

	if templateIDStr != "" {
		templateIDs := strings.Split(templateIDStr, ",")
		if len(templateIDs) > 0 {
			if err := h.svc.GenerateDailySchedulesWithTemplateIDs(childID, date, templateIDs); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "生成成功"})
			return
		}
	}

	if err := h.svc.GenerateDailySchedules(childID, date); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "生成成功"})
}

// --- Template handlers ---

func (h *ScheduleHandler) CreateTemplate(c *gin.Context) {
	var tpl model.ScheduleTemplate
	if err := c.ShouldBindJSON(&tpl); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.CreateTemplate(&tpl); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, tpl)
}

func (h *ScheduleHandler) UpdateTemplate(c *gin.Context) {
	id := c.Param("id")
	var tpl model.ScheduleTemplate
	if err := c.ShouldBindJSON(&tpl); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	tpl.ID = id
	if err := h.svc.UpdateTemplate(&tpl); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tpl)
}

func (h *ScheduleHandler) DeleteTemplate(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeleteTemplate(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

func (h *ScheduleHandler) ListTemplates(c *gin.Context) {
	templates, err := h.svc.ListTemplates()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, templates)
}