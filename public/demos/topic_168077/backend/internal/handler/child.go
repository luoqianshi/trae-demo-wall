package handler

import (
	"net/http"

	"coin-kids/internal/model"
	"coin-kids/internal/service"

	"github.com/gin-gonic/gin"
)

type ChildHandler struct {
	svc *service.ChildService
}

func NewChildHandler() *ChildHandler {
	return &ChildHandler{svc: service.NewChildService()}
}

func (h *ChildHandler) Create(c *gin.Context) {
	var child model.Child
	if err := c.ShouldBindJSON(&child); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Create(&child); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, child)
}

func (h *ChildHandler) Update(c *gin.Context) {
	id := c.Param("id")
	child, err := h.svc.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "孩子不存在"})
		return
	}
	if err := c.ShouldBindJSON(child); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Update(child); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, child)
}

func (h *ChildHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

func (h *ChildHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	child, err := h.svc.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "孩子不存在"})
		return
	}
	c.JSON(http.StatusOK, child)
}

func (h *ChildHandler) List(c *gin.Context) {
	children, err := h.svc.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, children)
}