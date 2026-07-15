package handler

import (
	"net/http"

	"coin-kids/internal/service"

	"github.com/gin-gonic/gin"
)

type ThemeHandler struct {
	svc *service.ThemeService
}

func NewThemeHandler() *ThemeHandler {
	return &ThemeHandler{svc: service.NewThemeService()}
}

func (h *ThemeHandler) GetCurrent(c *gin.Context) {
	c.JSON(http.StatusOK, h.svc.GetCurrentTheme())
}

func (h *ThemeHandler) ListThemes(c *gin.Context) {
	c.JSON(http.StatusOK, h.svc.ListAllThemes())
}