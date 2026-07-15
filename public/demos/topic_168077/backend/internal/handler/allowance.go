package handler

import (
	"net/http"

	"coin-kids/internal/service"

	"github.com/gin-gonic/gin"
)

type AllowanceHandler struct {
	svc *service.AllowanceService
}

func NewAllowanceHandler() *AllowanceHandler {
	return &AllowanceHandler{svc: service.NewAllowanceService()}
}

func (h *AllowanceHandler) GetBalance(c *gin.Context) {
	childID := c.Param("child_id")
	allowance, err := h.svc.GetBalance(childID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, allowance)
}

func (h *AllowanceHandler) ListTransactions(c *gin.Context) {
	childID := c.Param("child_id")
	txs, err := h.svc.ListTransactions(childID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, txs)
}

type SpendRequest struct {
	Amount      float64 `json:"amount" binding:"required"`
	Description string  `json:"description"`
}

func (h *AllowanceHandler) Spend(c *gin.Context) {
	childID := c.Param("child_id")
	var req SpendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Spend(childID, req.Amount, req.Description); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "消费成功"})
}