import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AvatarSelector from './AvatarSelector'

describe('AvatarSelector', () => {
  it('renders avatars for male gender', () => {
    render(<AvatarSelector gender="male" />)
    expect(screen.getByText('男孩1')).toBeInTheDocument()
    expect(screen.getByText('男孩2')).toBeInTheDocument()
    expect(screen.getByText('男孩3')).toBeInTheDocument()
    // animal avatars also shown for male
    expect(screen.getByText('小猫')).toBeInTheDocument()
  })

  it('renders avatars for female gender', () => {
    render(<AvatarSelector gender="female" />)
    expect(screen.getByText('女孩1')).toBeInTheDocument()
    expect(screen.getByText('女孩2')).toBeInTheDocument()
    expect(screen.getByText('女孩3')).toBeInTheDocument()
    expect(screen.getByText('熊猫')).toBeInTheDocument()
  })

  it('renders all avatars when no gender specified', () => {
    render(<AvatarSelector />)
    expect(screen.getByText('男孩1')).toBeInTheDocument()
    expect(screen.getByText('女孩1')).toBeInTheDocument()
    expect(screen.getByText('小猫')).toBeInTheDocument()
  })

  it('calls onChange when an avatar is selected', () => {
    const onChange = vi.fn()
    render(<AvatarSelector gender="male" onChange={onChange} />)
    fireEvent.click(screen.getByText('男孩1'))
    expect(onChange).toHaveBeenCalledWith('/avatars/boy1.png')
  })

  it('shows selected avatar as checked', () => {
    render(<AvatarSelector value="/avatars/boy2.png" gender="male" />)
    const radio = screen.getByText('男孩2').closest('.ant-radio-button-wrapper')
    expect(radio).toHaveClass('ant-radio-button-wrapper-checked')
  })
})