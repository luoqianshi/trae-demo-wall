export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
    id: number
    message: string
    type: ToastType
}

type Listener = (toasts: ToastItem[]) => void

let toastId = 0
let toasts: ToastItem[] = []
const listeners = new Set<Listener>()

function emit() {
    listeners.forEach((fn) => fn([...toasts]))
}

export function showToast(message: string, type: ToastType = 'info') {
    const id = ++toastId
    toasts = [...toasts, { id, message, type }]
    emit()
    setTimeout(() => {
        toasts = toasts.filter((t) => t.id !== id)
        emit()
    }, 3000)
}

export function subscribeToasts(fn: Listener): () => void {
    listeners.add(fn)
    fn([...toasts])
    return () => listeners.delete(fn)
}
