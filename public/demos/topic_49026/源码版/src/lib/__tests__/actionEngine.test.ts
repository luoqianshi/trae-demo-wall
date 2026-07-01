import { describe, it, expect, vi } from 'vitest'
import { extractCommitments, suggestActions, executeAction } from '../actionEngine'

describe('actionEngine', () => {
  it('extracts commitments', () => {
    const text = '周末陪儿子去买乐高。记得给妈妈回电话。'
    const result = extractCommitments(text)
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('suggests calendar and location actions', () => {
    const actions = suggestActions('周末陪儿子去买乐高')
    expect(actions.some((a) => a.type === 'calendar')).toBe(true)
    expect(actions.some((a) => a.type === 'location')).toBe(true)
  })

  it('opens map on location action', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    executeAction({ id: '1', type: 'location', title: '', description: '买乐高', payload: { keyword: '买乐高' } })
    expect(openSpy).toHaveBeenCalled()
    openSpy.mockRestore()
  })
})
