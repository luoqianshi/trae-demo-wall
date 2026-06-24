import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('渲染子内容', () => {
    render(<Button>点击我</Button>)
    expect(screen.getByRole('button', { name: '点击我' })).toBeInTheDocument()
  })

  it('应用默认 variant 类名', () => {
    render(<Button>默认</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('btn-primary')
  })

  it('应用 outline variant 类名', () => {
    render(<Button variant="outline">轮廓</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('btn-outline')
  })

  it('应用 sm size 类名', () => {
    render(<Button size="sm">小</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('btn-sm')
  })

  it('合并自定义 className', () => {
    render(<Button className="my-custom">自定义</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('my-custom')
  })

  it('点击时触发 onClick 回调', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>点</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disabled 属性生效', () => {
    render(<Button disabled>禁用</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('destructive variant 应用红色背景样式', () => {
    render(<Button variant="destructive">危险</Button>)
    const btn = screen.getByRole('button')
    expect(btn.style.background).toContain('hsl')
  })
})
