package handler

import (
	"net/http"

	"coin-kids/internal/model"
	"coin-kids/internal/service"

	"github.com/gin-gonic/gin"
)

type RewardHandler struct {
	svc *service.RewardService
}

func NewRewardHandler() *RewardHandler {
	return &RewardHandler{svc: service.NewRewardService()}
}

// --- Rules ---

func (h *RewardHandler) CreateRule(c *gin.Context) {
	var rule model.RewardRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.CreateRule(&rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, rule)
}

func (h *RewardHandler) UpdateRule(c *gin.Context) {
	id := c.Param("id")
	var rule model.RewardRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	rule.ID = id
	if err := h.svc.UpdateRule(&rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rule)
}

func (h *RewardHandler) DeleteRule(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeleteRule(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

func (h *RewardHandler) ListRules(c *gin.Context) {
	rules, err := h.svc.ListRules()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rules)
}

// --- Records ---

func (h *RewardHandler) CreateRecord(c *gin.Context) {
	var record model.RewardRecord
	if err := c.ShouldBindJSON(&record); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.CreateRecord(&record); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, record)
}

func (h *RewardHandler) ListRecords(c *gin.Context) {
	childID := c.Query("child_id")
	records, err := h.svc.ListRecords(childID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, records)
}

func (h *RewardHandler) UpdateRecord(c *gin.Context) {
	id := c.Param("id")
	var record model.RewardRecord
	if err := c.ShouldBindJSON(&record); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	record.ID = id
	if err := h.svc.UpdateRecord(&record); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, record)
}

func (h *RewardHandler) DeleteRecord(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeleteRecord(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}