package main

import (
	"fmt"
)

// User 表示目录中的一个用户。
type User struct {
	Name string
}

// Directory 是按 id 索引的用户目录。
type Directory struct {
	users map[int]*User
}

// 创建空目录。
func NewDirectory() *Directory {
	return &Directory{users: make(map[int]*User)}
}

// 注册 / 覆盖一个用户。
func (d *Directory) Add(id int, name string) {
	d.users[id] = &User{Name: name}
}

// 按 id 查找：找不到时返回 (nil, error)。
func (d *Directory) Find(id int) (*User, error) {
	u, ok := d.users[id]
	if !ok {
		return nil, fmt.Errorf("用户不存在: id=%d", id)
	}
	return u, nil
}

// 解析展示名：关键——必须先检查 err，错误时返回 ("", error)，不得对 nil 解引用。
func (d *Directory) DisplayName(id int) (string, error) {
	u, err := d.Find(id)
	if err != nil {
		return "", err
	}
	return u.Name, nil
}
