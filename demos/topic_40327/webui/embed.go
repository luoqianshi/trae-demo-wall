// Package frontend 嵌入前端构建产物
package frontend

import "embed"

//go:embed dist/*
var Dist embed.FS
