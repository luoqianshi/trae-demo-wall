package service

import "time"

type ThemeInfo struct {
	Theme string `json:"theme"`
	Name  string `json:"name"`
	Label string `json:"label"`
}

// 中国传统节日（近似公历日期，基于2025-2027年估算）
type festivalRule struct {
	month    int
	dayStart int
	dayEnd   int
	theme    string
	name     string
	label    string
}

var festivalRules = []festivalRule{
	{1, 1, 1, "new-year", "元旦", "元旦主题"},
	// 春节（农历正月初一，2026年≈2月17日）
	{2, 12, 22, "spring-festival", "春节", "春节主题"},
	// 元宵节（农历正月十五，2026年≈3月3日）
	{2, 28, 28, "spring-festival", "元宵节", "春节主题"},
	{3, 1, 5, "spring-festival", "元宵节", "春节主题"},
	// 儿童节
	{5, 31, 31, "children-day", "儿童节", "儿童节主题"},
	{6, 1, 2, "children-day", "儿童节", "儿童节主题"},
	// 端午节（农历五月初五，2026年≈6月19日）
	{6, 16, 22, "dragon-boat", "端午节", "端午节主题"},
	// 中秋节（农历八月十五，2026年≈10月6日）
	{10, 3, 9, "mid-autumn", "中秋节", "中秋节主题"},
	// 国庆节
	{10, 1, 2, "national-day", "国庆节", "国庆节主题"},
	// 冬至（≈12月22日）
	{12, 20, 23, "winter-solstice", "冬至", "冬至主题"},
}

type ThemeService struct{}

func NewThemeService() *ThemeService {
	return &ThemeService{}
}

func (s *ThemeService) GetCurrentTheme() ThemeInfo {
	return s.GetThemeForDate(time.Now())
}

func (s *ThemeService) GetThemeForDate(t time.Time) ThemeInfo {
	for _, rule := range festivalRules {
		if int(t.Month()) == rule.month && t.Day() >= rule.dayStart && t.Day() <= rule.dayEnd {
			return ThemeInfo{Theme: rule.theme, Name: rule.name, Label: rule.label}
		}
	}
	return ThemeInfo{Theme: "default", Name: "", Label: "默认主题"}
}

func (s *ThemeService) ListAllThemes() []ThemeInfo {
	themes := []ThemeInfo{
		{Theme: "default", Name: "", Label: "默认主题"},
		{Theme: "dark", Name: "", Label: "黑暗护眼模式"},
	}
	seen := map[string]bool{"default": true, "dark": true}
	for _, rule := range festivalRules {
		if !seen[rule.theme] {
			seen[rule.theme] = true
			themes = append(themes, ThemeInfo{Theme: rule.theme, Name: rule.name, Label: rule.label})
		}
	}
	return themes
}