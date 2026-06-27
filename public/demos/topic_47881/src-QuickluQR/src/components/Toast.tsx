import { useEffect, useState } from 'react'
import { subscribeToasts } from './toastStore'
import type { ToastItem } from './toastStore'

export default function Toast() {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    useEffect(() => {
        return subscribeToasts(setToasts)
    }, [])

    if (toasts.length === 0) return null

    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    <span className="toast-icon">
                        {t.type === 'success' && '✓'}
                        {t.type === 'error' && '✕'}
                        {t.type === 'info' && 'ⓘ'}
                    </span>
                    {t.message}
                </div>
            ))}
        </div>
    )
}
