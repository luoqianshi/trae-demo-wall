package handler

import (
	"net/http"
	"time"

	"coin-kids/internal/model"
	"coin-kids/internal/service"

	"github.com/gin-gonic/gin"
)

type ClockHandler struct {
	svc *service.ClockService
}

func NewClockHandler() *ClockHandler {
	return &ClockHandler{svc: service.NewClockService()}
}

// ESP32ClockIn ESP32打卡专用接口（轻量级）
type ESP32ClockIn struct {
	ChildID   string `json:"child_id" binding:"required"`
	DeviceID  string `json:"device_id" binding:"required"`
	EventType string `json:"event_type" binding:"required"`
	Timestamp string `json:"timestamp"`
}

func (h *ClockHandler) ESP32ClockIn(c *gin.Context) {
	var req ESP32ClockIn
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record := &model.ClockInRecord{
		ChildID:   req.ChildID,
		DeviceID:  req.DeviceID,
		EventType: req.EventType,
		Status:    "pending",
	}

	if req.Timestamp != "" {
		t, err := time.Parse(time.RFC3339, req.Timestamp)
		if err == nil {
			record.Timestamp = t
		}
	}

	if err := h.svc.Create(record); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, record)
}

func (h *ClockHandler) Confirm(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.Confirm(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "已确认"})
}

func (h *ClockHandler) Reject(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.Reject(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "已拒绝"})
}

func (h *ClockHandler) ListByChild(c *gin.Context) {
	childID := c.Param("child_id")
	records, err := h.svc.ListByChild(childID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, records)
}

func (h *ClockHandler) ListByDevice(c *gin.Context) {
	deviceID := c.Query("device_id")
	records, err := h.svc.ListByDevice(deviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, records)
}