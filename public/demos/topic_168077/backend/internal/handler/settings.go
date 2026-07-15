package handler

import (
	"net/http"
	"coin-kids/internal/model"
	"coin-kids/internal/repository"
	"github.com/gin-gonic/gin"
)

type SettingsHandler struct{}

func NewSettingsHandler() *SettingsHandler {
	return &SettingsHandler{}
}

func (h *SettingsHandler) Get(c *gin.Context) {
	c.JSON(http.StatusOK, repository.GetSettings())
}

func (h *SettingsHandler) Update(c *gin.Context) {
	var s model.SystemSetting
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := repository.UpdateSettings(s); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "保存成功"})
}