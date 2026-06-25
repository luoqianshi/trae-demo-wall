package main

import (
	"errors"
	"fmt"
)

// Pool 是受限并发的任务执行池：占用/归还槽位，并兜住任务 panic。
type Pool struct {
	max    int
	active int
}

// 创建容量为 max 的池。
func NewPool(max int) *Pool {
	return &Pool{max: max}
}

// 当前占用槽位数。
func (p *Pool) Active() int {
	return p.active
}

// 占用一个槽位执行 fn。
func (p *Pool) RunTask(fn func() error) (err error) {
	// 容量检查：已满则拒绝，不占用槽位。
	if p.active >= p.max {
		return errors.New("池已满，拒绝新任务")
	}
	p.active++
	// 兜住任务 panic，转成普通错误返回。
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("任务 panic: %v", r)
		}
	}()
	err = fn()
	// 任务结束后归还槽位。
	p.active--
	return err
}
