package handler

import (
	"net/http"
	"strconv"

	"coin-kids/internal/festival"

	"github.com/gin-gonic/gin"
)

type FestivalHandler struct {
	svc *festival.Service
}

func NewFestivalHandler() *FestivalHandler {
	return &FestivalHandler{svc: festival.NewService()}
}

// GetToday 获取今日节日信息
func (h *FestivalHandler) GetToday(c *gin.Context) {
	festivals := h.svc.GetFestivalsForDate(festival.Now())
	currentTheme := "default"
	if len(festivals) > 0 {
		currentTheme = festivals[0].Theme
	}
	c.JSON(http.StatusOK, gin.H{
		"festivals": festivals,
		"theme":     currentTheme,
		"label":     h.svc.FormatCurrentFestival(),
	})
}

// GetByDate 获取指定日期的节日
func (h *FestivalHandler) GetByDate(c *gin.Context) {
	dateStr := c.Query("date")
	if dateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少 date 参数 (YYYY-MM-DD)"})
		return
	}
	t, err := festival.ParseDate(dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "日期格式错误: " + err.Error()})
		return
	}
	festivals := h.svc.GetFestivalsForDate(t)
	c.JSON(http.StatusOK, gin.H{"festivals": festivals})
}

// ListByYear 获取某年所有节日
func (h *FestivalHandler) ListByYear(c *gin.Context) {
	yearStr := c.DefaultQuery("year", strconv.Itoa(festival.Now().Year()))
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "年份格式错误"})
		return
	}
	festivals := h.svc.ListFestivalsByYear(year)
	c.JSON(http.StatusOK, festivals)
}

// GetThemes 获取所有可用主题
func (h *FestivalHandler) GetThemes(c *gin.Context) {
	current := h.svc.GetCurrentTheme()
	themeMap := map[string]string{
		"default":         "默认主题",
		"dark":            "黑暗护眼模式",
		"spring-festival": "春节主题",
		"new-year":        "元旦主题",
		"children-day":    "儿童节主题",
		"dragon-boat":     "端午节主题",
		"mid-autumn":      "中秋节主题",
		"national-day":    "国庆节主题",
		"winter-solstice": "冬至主题",
		"qixi":            "七夕主题",
	}
	var themes []gin.H
	for key, label := range themeMap {
		themes = append(themes, gin.H{
			"theme":   key,
			"label":   label,
			"current": key == current,
		})
	}
	c.JSON(http.StatusOK, themes)
}