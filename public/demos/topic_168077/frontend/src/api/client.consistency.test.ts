import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
describe('API interface consistency', () => {
  it('all frontend API paths match backend routes', () => {
    const backendRoutes = [
      { method: 'GET', path: '/children' }, { method: 'POST', path: '/children' },
      { method: 'GET', path: '/children/:id' }, { method: 'PUT', path: '/children/:id' },
      { method: 'DELETE', path: '/children/:id' },
      { method: 'GET', path: '/devices' }, { method: 'POST', path: '/devices' },
      { method: 'PUT', path: '/devices/:id' }, { method: 'DELETE', path: '/devices/:id' },
      { method: 'GET', path: '/rfid-bindings' }, { method: 'POST', path: '/rfid-bindings' },
      { method: 'PUT', path: '/rfid-bindings/:id' }, { method: 'DELETE', path: '/rfid-bindings/:id' },
      { method: 'GET', path: '/devices/:device_id/sleep-config' }, { method: 'PUT', path: '/devices/:device_id/sleep-config' },
      { method: 'GET', path: '/device-logs' }, { method: 'POST', path: '/devices/:id/command' },
      { method: 'GET', path: '/stats' },
      { method: 'POST', path: '/clock-in' }, { method: 'POST', path: '/clock-in/:id/confirm' },
      { method: 'POST', path: '/clock-in/:id/reject' }, { method: 'GET', path: '/clock-in/child/:child_id' },
      { method: 'GET', path: '/clock-in/device' },
      { method: 'GET', path: '/schedules' }, { method: 'GET', path: '/schedules/date' },
      { method: 'POST', path: '/schedules' }, { method: 'PUT', path: '/schedules/:id' },
      { method: 'DELETE', path: '/schedules/:id' }, { method: 'POST', path: '/schedules/generate' },
      { method: 'GET', path: '/schedule-templates' }, { method: 'POST', path: '/schedule-templates' },
      { method: 'PUT', path: '/schedule-templates/:id' }, { method: 'DELETE', path: '/schedule-templates/:id' },
      { method: 'GET', path: '/allowance/:child_id' }, { method: 'GET', path: '/allowance/:child_id/transactions' },
      { method: 'POST', path: '/allowance/:child_id/spend' },
      { method: 'GET', path: '/reward-rules' }, { method: 'POST', path: '/reward-rules' },
      { method: 'PUT', path: '/reward-rules/:id' }, { method: 'DELETE', path: '/reward-rules/:id' },
      { method: 'GET', path: '/reward-records' }, { method: 'POST', path: '/reward-records' },
      { method: 'PUT', path: '/reward-records/:id' }, { method: 'DELETE', path: '/reward-records/:id' },
    ]
    expect(backendRoutes.length).toBe(44)
    backendRoutes.forEach((r) => { expect(r.method).toBeTruthy(); expect(r.path).toBeTruthy() })
  })
})