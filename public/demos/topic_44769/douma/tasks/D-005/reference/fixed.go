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

// 占用一个槽位执行 fn，保证无论何种路径都归还槽位。
func (p *Pool) RunTask(fn func() error) (err error) {
	// 容量检查：已满则拒绝，不占用槽位。
	if p.active >= p.max {
		return errors.New("池已满，拒绝新任务")
	}
	p.active++
	// 关键：占用成功后立即用 defer 登记归还，
	// 这样无论 fn 正常返回、返回错误还是 panic，槽位都会被归还，active 不泄漏。
	defer func() {
		p.active--
		if r := recover(); r != nil {
			// 兜住 panic 转成普通错误，不让其冒泡崩溃进程。
			err = fmt.Errorf("任务 panic: %v", r)
		}
	}()
	return fn()
}
